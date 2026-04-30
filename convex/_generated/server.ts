type QueryBuilder = {
  eq: (field: string, value: unknown) => unknown;
};

type DbQuery = {
  collect: () => Promise<unknown[]>;
  unique: () => Promise<unknown | null>;
  withIndex: (name: string, callback: (query: QueryBuilder) => unknown) => DbQuery;
};

type DbClient = {
  query: (table: string) => DbQuery;
  patch: (id: unknown, value: unknown) => Promise<void>;
  insert: (table: string, value: unknown) => Promise<void>;
};

type StubContext = {
  db: DbClient;
};

type Handler<TArgs> = (ctx: StubContext, args: TArgs) => unknown;

export function query<TArgs, T extends { args?: unknown; handler: Handler<TArgs> }>(definition: T) {
  return definition;
}

export function mutation<TArgs, T extends { args?: unknown; handler: Handler<TArgs> }>(definition: T) {
  return definition;
}
