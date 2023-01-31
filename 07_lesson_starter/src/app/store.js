import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../features/api/apiSlice";
import usersReducer from "../features/users/usersSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    users: usersReducer,
  },
  // getDefaultMiddleware is default middleware and returns an array
  // of all the middlewares. We use concat and also add new middleware
  // that apiSlice creates.
  // The apiSlice middleware manages cache lifetimes and expirations and
  // it is required when we are using rtk query and an api slice
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
