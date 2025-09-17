import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateUserData {
  user_insert: User_Key;
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

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

export interface RegisterUserForEventData {
  registration_insert: Registration_Key;
}

export interface RegisterUserForEventVariables {
  eventId: UUIDString;
}

export interface Registration_Key {
  userId: UUIDString;
  eventId: UUIDString;
  __typename?: 'Registration_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface ListEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEventsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListEventsData, undefined>;
  operationName: string;
}
export const listEventsRef: ListEventsRef;

export function listEvents(): QueryPromise<ListEventsData, undefined>;
export function listEvents(dc: DataConnect): QueryPromise<ListEventsData, undefined>;

interface RegisterUserForEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterUserForEventVariables): MutationRef<RegisterUserForEventData, RegisterUserForEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RegisterUserForEventVariables): MutationRef<RegisterUserForEventData, RegisterUserForEventVariables>;
  operationName: string;
}
export const registerUserForEventRef: RegisterUserForEventRef;

export function registerUserForEvent(vars: RegisterUserForEventVariables): MutationPromise<RegisterUserForEventData, RegisterUserForEventVariables>;
export function registerUserForEvent(dc: DataConnect, vars: RegisterUserForEventVariables): MutationPromise<RegisterUserForEventData, RegisterUserForEventVariables>;

interface GetUserRegistrationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserRegistrationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserRegistrationsData, undefined>;
  operationName: string;
}
export const getUserRegistrationsRef: GetUserRegistrationsRef;

export function getUserRegistrations(): QueryPromise<GetUserRegistrationsData, undefined>;
export function getUserRegistrations(dc: DataConnect): QueryPromise<GetUserRegistrationsData, undefined>;

