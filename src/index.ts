/*
 * Copyright (c) 2024 Discuzz Labs Organization
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for license information.
 */
export { veve as default } from "./config/Config.js";

export { spec } from "./reporter/spec.js";
export { junit } from "./reporter/junit.js";
export { json } from "./reporter/json.js";

export { is, assert, Assertion } from "./framework/Assertion.js";
export { isFn, Fn, spyOn, TrackFn } from "./framework/Fn.js";
export { TestCase } from "./framework/TestCase.js";
