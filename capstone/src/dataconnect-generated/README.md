# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListEvents*](#listevents)
  - [*GetUserRegistrations*](#getuserregistrations)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*RegisterUserForEvent*](#registeruserforevent)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListEvents
You can execute the `ListEvents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listEvents(): QueryPromise<ListEventsData, undefined>;

interface ListEventsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEventsData, undefined>;
}
export const listEventsRef: ListEventsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listEvents(dc: DataConnect): QueryPromise<ListEventsData, undefined>;

interface ListEventsRef {
  ...
  (dc: DataConnect): QueryRef<ListEventsData, undefined>;
}
export const listEventsRef: ListEventsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listEventsRef:
```typescript
const name = listEventsRef.operationName;
console.log(name);
```

### Variables
The `ListEvents` query has no variables.
### Return Type
Recall that executing the `ListEvents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListEventsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListEventsData {
  events: ({
    id: UUIDString;
    title: string;
    description: string;
    eventDate: DateString;
    startTime?: TimestampString | null;
    endTime?: TimestampString | null;
    location: string;
    maxAttendees?: number | null;
    status: string;
  } & Event_Key)[];
}
```
### Using `ListEvents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listEvents } from '@dataconnect/generated';


// Call the `listEvents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listEvents();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listEvents(dataConnect);

console.log(data.events);

// Or, you can use the `Promise` API.
listEvents().then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

### Using `ListEvents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listEventsRef } from '@dataconnect/generated';


// Call the `listEventsRef()` function to get a reference to the query.
const ref = listEventsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listEventsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.events);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

## GetUserRegistrations
You can execute the `GetUserRegistrations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserRegistrations(): QueryPromise<GetUserRegistrationsData, undefined>;

interface GetUserRegistrationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserRegistrationsData, undefined>;
}
export const getUserRegistrationsRef: GetUserRegistrationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserRegistrations(dc: DataConnect): QueryPromise<GetUserRegistrationsData, undefined>;

interface GetUserRegistrationsRef {
  ...
  (dc: DataConnect): QueryRef<GetUserRegistrationsData, undefined>;
}
export const getUserRegistrationsRef: GetUserRegistrationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserRegistrationsRef:
```typescript
const name = getUserRegistrationsRef.operationName;
console.log(name);
```

### Variables
The `GetUserRegistrations` query has no variables.
### Return Type
Recall that executing the `GetUserRegistrations` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserRegistrationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserRegistrationsData {
  registrations: ({
    event: {
      id: UUIDString;
      title: string;
      description: string;
      eventDate: DateString;
    } & Event_Key;
      registeredAt: TimestampString;
      status?: string | null;
  })[];
}
```
### Using `GetUserRegistrations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserRegistrations } from '@dataconnect/generated';


// Call the `getUserRegistrations()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserRegistrations();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserRegistrations(dataConnect);

console.log(data.registrations);

// Or, you can use the `Promise` API.
getUserRegistrations().then((response) => {
  const data = response.data;
  console.log(data.registrations);
});
```

### Using `GetUserRegistrations`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserRegistrationsRef } from '@dataconnect/generated';


// Call the `getUserRegistrationsRef()` function to get a reference to the query.
const ref = getUserRegistrationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserRegistrationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.registrations);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.registrations);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## RegisterUserForEvent
You can execute the `RegisterUserForEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
registerUserForEvent(vars: RegisterUserForEventVariables): MutationPromise<RegisterUserForEventData, RegisterUserForEventVariables>;

interface RegisterUserForEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterUserForEventVariables): MutationRef<RegisterUserForEventData, RegisterUserForEventVariables>;
}
export const registerUserForEventRef: RegisterUserForEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
registerUserForEvent(dc: DataConnect, vars: RegisterUserForEventVariables): MutationPromise<RegisterUserForEventData, RegisterUserForEventVariables>;

interface RegisterUserForEventRef {
  ...
  (dc: DataConnect, vars: RegisterUserForEventVariables): MutationRef<RegisterUserForEventData, RegisterUserForEventVariables>;
}
export const registerUserForEventRef: RegisterUserForEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registerUserForEventRef:
```typescript
const name = registerUserForEventRef.operationName;
console.log(name);
```

### Variables
The `RegisterUserForEvent` mutation requires an argument of type `RegisterUserForEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegisterUserForEventVariables {
  eventId: UUIDString;
}
```
### Return Type
Recall that executing the `RegisterUserForEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegisterUserForEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegisterUserForEventData {
  registration_insert: Registration_Key;
}
```
### Using `RegisterUserForEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registerUserForEvent, RegisterUserForEventVariables } from '@dataconnect/generated';

// The `RegisterUserForEvent` mutation requires an argument of type `RegisterUserForEventVariables`:
const registerUserForEventVars: RegisterUserForEventVariables = {
  eventId: ..., 
};

// Call the `registerUserForEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registerUserForEvent(registerUserForEventVars);
// Variables can be defined inline as well.
const { data } = await registerUserForEvent({ eventId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registerUserForEvent(dataConnect, registerUserForEventVars);

console.log(data.registration_insert);

// Or, you can use the `Promise` API.
registerUserForEvent(registerUserForEventVars).then((response) => {
  const data = response.data;
  console.log(data.registration_insert);
});
```

### Using `RegisterUserForEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, registerUserForEventRef, RegisterUserForEventVariables } from '@dataconnect/generated';

// The `RegisterUserForEvent` mutation requires an argument of type `RegisterUserForEventVariables`:
const registerUserForEventVars: RegisterUserForEventVariables = {
  eventId: ..., 
};

// Call the `registerUserForEventRef()` function to get a reference to the mutation.
const ref = registerUserForEventRef(registerUserForEventVars);
// Variables can be defined inline as well.
const ref = registerUserForEventRef({ eventId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registerUserForEventRef(dataConnect, registerUserForEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.registration_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.registration_insert);
});
```

