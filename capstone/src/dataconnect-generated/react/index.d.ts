import { CreateUserData, ListEventsData, RegisterUserForEventData, RegisterUserForEventVariables, GetUserRegistrationsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useListEvents(options?: useDataConnectQueryOptions<ListEventsData>): UseDataConnectQueryResult<ListEventsData, undefined>;
export function useListEvents(dc: DataConnect, options?: useDataConnectQueryOptions<ListEventsData>): UseDataConnectQueryResult<ListEventsData, undefined>;

export function useRegisterUserForEvent(options?: useDataConnectMutationOptions<RegisterUserForEventData, FirebaseError, RegisterUserForEventVariables>): UseDataConnectMutationResult<RegisterUserForEventData, RegisterUserForEventVariables>;
export function useRegisterUserForEvent(dc: DataConnect, options?: useDataConnectMutationOptions<RegisterUserForEventData, FirebaseError, RegisterUserForEventVariables>): UseDataConnectMutationResult<RegisterUserForEventData, RegisterUserForEventVariables>;

export function useGetUserRegistrations(options?: useDataConnectQueryOptions<GetUserRegistrationsData>): UseDataConnectQueryResult<GetUserRegistrationsData, undefined>;
export function useGetUserRegistrations(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserRegistrationsData>): UseDataConnectQueryResult<GetUserRegistrationsData, undefined>;
