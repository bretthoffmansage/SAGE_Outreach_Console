/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents from "../agents.js";
import type * as approvals from "../approvals.js";
import type * as campaigns from "../campaigns.js";
import type * as globalStatus from "../globalStatus.js";
import type * as integrations from "../integrations.js";
import type * as keapSync from "../keapSync.js";
import type * as library from "../library.js";
import type * as linking from "../linking.js";
import type * as responses from "../responses.js";
import type * as runtime_agentRuntime from "../runtime/agentRuntime.js";
import type * as runtime_buildAgentContext from "../runtime/buildAgentContext.js";
import type * as runtime_envValidation from "../runtime/envValidation.js";
import type * as runtime_helpdesk from "../runtime/helpdesk.js";
import type * as runtime_keap from "../runtime/keap.js";
import type * as runtime_modelProviders from "../runtime/modelProviders.js";
import type * as runtimePrep from "../runtimePrep.js";
import type * as todayTasks from "../todayTasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  approvals: typeof approvals;
  campaigns: typeof campaigns;
  globalStatus: typeof globalStatus;
  integrations: typeof integrations;
  keapSync: typeof keapSync;
  library: typeof library;
  linking: typeof linking;
  responses: typeof responses;
  "runtime/agentRuntime": typeof runtime_agentRuntime;
  "runtime/buildAgentContext": typeof runtime_buildAgentContext;
  "runtime/envValidation": typeof runtime_envValidation;
  "runtime/helpdesk": typeof runtime_helpdesk;
  "runtime/keap": typeof runtime_keap;
  "runtime/modelProviders": typeof runtime_modelProviders;
  runtimePrep: typeof runtimePrep;
  todayTasks: typeof todayTasks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
