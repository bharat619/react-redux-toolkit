import { createSlice, nanoid } from "@reduxjs/toolkit";
import { sub } from "date-fns";

const initialState = [
  {
    id: "1",
    title: "Learning Redux Toolkit",
    content: "This is good",
    date: sub(new Date(), { minutes: 10 }).toISOString(),
    reactions: {
      thumbsUp: 0,
      wow: 0,
      heart: 0,
      rocket: 0,
      coffee: 0,
    },
  },
  {
    id: "2",
    title: "Slices....",
    content: "The more I say slice, the more I want pizza.",
    date: sub(new Date(), { minutes: 15 }).toISOString(),
    reactions: {
      thumbsUp: 0,
      wow: 0,
      heart: 0,
      rocket: 0,
      coffee: 0,
    },
  },
];

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    postAdded: {
      reducer(state, action) {
        // Note that we dont do the usual spreading of state and adding the new payload.
        // Because redux toolkit uses ember, and its push will mutate the state.
        // This holds true only in the createSlice
        state.push(action.payload);
      },
      prepare(title, content, userId) {
        // The prepare function is invoked before the reducer function is invoked.
        // Advantage will be that, the component need not remember all the data formatting,
        // and the logic can be moved to this common place
        return {
          payload: {
            id: nanoid(),
            title,
            content,
            userId,
            date: new Date().toISOString(),
            reactions: {
              thumbsUp: 0,
              wow: 0,
              heart: 0,
              rocket: 0,
              coffee: 0,
            },
          },
        };
      },
    },
    reactionAdded(state, action) {
      const { postId, reaction } = action.payload;
      const existingPost = state.find((post) => post.id === postId);
      // This would mutate the state normally, but since we are inside
      // createSlice, and ember will handle this, it will not mutate the state
      // and everything still works fine
      if (existingPost) {
        existingPost.reactions[reaction]++;
      } else {
        existingPost.reactions[reaction] = 1;
      }
    },
  },
});

export const selectAllPosts = (state) => state.posts;
export const { postAdded, reactionAdded } = postsSlice.actions; // actions are got from createSlice above
export default postsSlice.reducer;
