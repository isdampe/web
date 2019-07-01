/* Pi-hole: A black hole for Internet advertisements
 * (c) 2019 Pi-hole, LLC (https://pi-hole.net)
 * Network-wide ad blocking via your own hardware.
 *
 * Web Interface
 * Preferences Saga
 *
 * This file is copyright under the latest version of the EUPL.
 * Please see LICENSE file for your rights under this license. */

import { call, put, takeEvery, select } from "redux-saga/effects";
import { PayloadAction } from "redux-starter-kit";
import i18n from "i18next";
import api from "../../util/api";
import { preferencesRequest, preferencesSuccess } from "../actions";
import config from "../../config";
import { WEB_PREFERENCES_STORAGE_KEY } from "../state/preferences";

/**
 * Sets up action listeners and triggers the initial preferences fetch
 */
export function* watchPreferences() {
  yield takeEvery(preferencesRequest.type, fetchPreferences);
  yield takeEvery(preferencesSuccess.type, cachePreferences);
  yield takeEvery(preferencesSuccess.type, applyLanguage);

  // Perform initial request
  yield put(preferencesRequest());
}

/**
 * A saga to fetch web interface preferences from the API
 */
export function* fetchPreferences() {
  let preferences: ApiPreferences;

  if (config.fakeAPI) {
    // Use the existing preferences
    preferences = yield select(state => state.preferences);
  } else {
    // Get the preferences from the API
    preferences = yield call(api.getPreferences);
  }

  // Update the store
  yield put(preferencesSuccess(preferences));
}

/**
 * Cache the preferences in local storage
 *
 * @param action The action with the preferences to cache
 */
export function* cachePreferences(action: PayloadAction<ApiPreferences>) {
  // Cache the preferences in local storage
  yield call(
    [localStorage, "setItem"],
    WEB_PREFERENCES_STORAGE_KEY,
    JSON.stringify(action.payload)
  );
}

/**
 * Update the language in i18next when it changes
 *
 * @param action The action with the preferences to cache
 */
export function* applyLanguage(action: PayloadAction<ApiPreferences>) {
  const language = action.payload.language;

  // Only change the language if it's different
  if (i18n.language !== language) {
    yield call([i18n, "changeLanguage"], language);
  }
}
