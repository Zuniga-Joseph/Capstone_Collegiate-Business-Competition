import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'capstonecollegiate-business-competition',
  location: 'us-central1'
};

export const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';

export function createUser(dc) {
  return executeMutation(createUserRef(dc));
}

export const listEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEvents');
}
listEventsRef.operationName = 'ListEvents';

export function listEvents(dc) {
  return executeQuery(listEventsRef(dc));
}

export const registerUserForEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegisterUserForEvent', inputVars);
}
registerUserForEventRef.operationName = 'RegisterUserForEvent';

export function registerUserForEvent(dcOrVars, vars) {
  return executeMutation(registerUserForEventRef(dcOrVars, vars));
}

export const getUserRegistrationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserRegistrations');
}
getUserRegistrationsRef.operationName = 'GetUserRegistrations';

export function getUserRegistrations(dc) {
  return executeQuery(getUserRegistrationsRef(dc));
}

