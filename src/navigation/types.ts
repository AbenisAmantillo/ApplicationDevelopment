import type { NavigatorScreenParams } from '@react-navigation/native';

import { ROUTES } from '../utils';

export type AuthStackParamList = {
  [ROUTES.LOGIN]: { notice?: string; resendEmail?: string } | undefined;
  [ROUTES.REGISTER]: undefined;
};

export type MainTabParamList = {
  [ROUTES.DASHBOARD]: undefined;
  [ROUTES.CATALOG]: undefined;
  [ROUTES.TRANSACTIONS]: undefined;
  [ROUTES.ADMIN_NOTIFICATIONS]: undefined;
  [ROUTES.ACTIVITY_LOGS]: undefined;
  [ROUTES.DATA_RECORDS]: undefined;
  [ROUTES.MY_TRANSACTIONS]: undefined;
  [ROUTES.PAYMENT]: undefined;
  [ROUTES.PROFILE]: undefined;
};

export type MainStackParamList = {
  [ROUTES.MAIN_TABS]: NavigatorScreenParams<MainTabParamList> | undefined;
  [ROUTES.CHECKOUT]: { propertyId: number };
  [ROUTES.STAFF_BLOCKED]: undefined;
};
