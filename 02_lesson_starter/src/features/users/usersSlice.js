import { createSlice } from "@reduxjs/toolkit";

const initialState = [
  { id: "1", name: "Dude Lebowski" },
  { id: "2", name: "Meil Young" },
  { id: "3", name: "Bharat Hegde" },
];

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
});

export const selectAllUsers = (state) => state.users;

export default userSlice.reducer;
