import { env } from "@/lib/env";
import type { CalendarAdapter, ModelAdapter, VapiAdapter } from "@/lib/adapters/types";

import { vapiStub } from "@/lib/adapters/vapi/stub";
import { vapiReal } from "@/lib/adapters/vapi/real";
import { calendarStub } from "@/lib/adapters/calendar/stub";
import { calendarReal } from "@/lib/adapters/calendar/real";
import { modelStub } from "@/lib/adapters/model/stub";
import { modelReal } from "@/lib/adapters/model/real";

// One-line swap: flip USE_STUBS in env to switch every external service over
// to its real implementation. No other code needs to change.
export const adapters = {
  vapi:     (env.USE_STUBS ? vapiStub     : vapiReal)     as VapiAdapter,
  calendar: (env.USE_STUBS ? calendarStub : calendarReal) as CalendarAdapter,
  model:    (env.USE_STUBS ? modelStub    : modelReal)    as ModelAdapter,
};

export type { CalendarAdapter, ModelAdapter, VapiAdapter } from "@/lib/adapters/types";
