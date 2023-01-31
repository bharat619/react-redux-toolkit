import {
  createSlice,
  nanoid,
  createAsyncThunk,
  createSelector,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import { sub } from "date-fns";
import axios from "axios";

const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

const postsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState({
  // posts: [],
  // Notice the we got rid of posts empty array. Because our initial state
  // (even if we  dont put anything for posts) will already returned the normalized object
  // i.e. { id: [1,2,3], entities: { '1': {...}, '2': {...} }},

  // status, error and count are just the extra states we are adding
  // on top of adapter
  status: "idle", // idle | loading | succeeded |
  error: null,
  count: 0,
});

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
  try {
    const response = await axios.get(POSTS_URL);
    return [...response.data];
  } catch (err) {
    return err.message;
  }
});

export const addNewPost = createAsyncThunk(
  "posts/addNewPost",
  async (initialPost) => {
    try {
      const response = await axios.post(POSTS_URL, initialPost);
      return response.data;
    } catch (err) {
      return err.message;
    }
  }
);

export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async (initialPost) => {
    const { id } = initialPost;
    try {
      const response = await axios.put(`${POSTS_URL}/${id}`, initialPost);
      return response.data;
    } catch (err) {
      return err.message;
    }
  }
);

export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (initialPost) => {
    const { id } = initialPost;
    try {
      const response = await axios.delete(`${POSTS_URL}/${id}`);
      if (response?.status === 200) return initialPost;
      return `${response?.status}: ${response?.statusText}`;
    } catch (error) {
      return error.message;
    }
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    postAdded: {
      reducer(state, action) {
        // Note that we dont do the usual spreading of state and adding the new payload.
        // Because redux toolkit uses ember, and its push will mutate the state.
        // This holds true only in the createSlice
        state.posts.push(action.payload);
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
    // Before using createEntityAdapter
    // reactionAdded(state, action) {
    //   const { postId, reaction } = action.payload;
    //   const existingPost = state.posts.find((post) => post.id === postId);
    //   // This would mutate the state normally, but since we are inside
    //   // createSlice, and ember will handle this, it will not mutate the state
    //   // and everything still works fine
    //   if (existingPost) {
    //     existingPost.reactions[reaction]++;
    //   } else {
    //     existingPost.reactions[reaction] = 1;
    //   }
    // },
    // increaseCount(state, action) {
    //   state.count = state.count + 1;
    // },

    reactionAdded(state, action) {
      const { postId, reaction } = action.payload;

      // entities will be an object with post id as key,
      const existingPost = state.entities[postId];

      if (existingPost) {
        existingPost.reactions[reaction]++;
      } else {
        existingPost.reactions[reaction] = 1;
      }
    },
    increaseCount(state, action) {
      state.count = state.count + 1;
    },
  },
  // sometimes slice reducers needs to respond to other actions
  // that werent defined as part of slice's reducers and that is what
  // happens here with our async thunk fetch posts

  // The builder parameter is an object that lets us define additional
  // case reducers that run in response to the actions defined outside
  // of the slice
  extraReducers(builder) {
    console.log("extraReducers");
    builder
      .addCase(fetchPosts.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Adding date and reactions
        let min = 1;
        const loadedPosts = action.payload.map((post) => {
          post.date = sub(new Date(), { minutes: min++ }).toISOString();
          post.reactions = {
            thumbsUp: 0,
            wow: 0,
            heart: 0,
            rocket: 0,
            coffee: 0,
          };
          return post;
        });

        // Add fetched posts to the array
        // state.posts = state.posts.concat(loadedPosts);

        // adaptor has its own methods. upsertMany takes in the sate
        // and loaded posts
        postsAdapter.upsertMany(state, loadedPosts);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addNewPost.fulfilled, (state, action) => {
        action.payload.userId = Number(action.payload.userId);
        action.payload.dae = new Date().toISOString();
        action.payload.reactions = {
          thumbsUp: 0,
          wow: 0,
          heart: 0,
          rocket: 0,
          coffee: 0,
        };
        console.log(action.payload);
        // state.posts.push(action.payload);
        postsAdapter.addOne(state, action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        if (!action.payload?.id) {
          console.log("update could not complete");
          return;
        }
        const { id } = action.payload;
        action.payload.date = new Date().toISOString();
        const posts = state.posts.filter((post) => post.id !== id);
        postsAdapter.upsertOne(state, action.payload``);
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        if (!action.payload?.id) {
          console.log("delete could not complete");
          return;
        }
        const { id } = action.payload;
        // const posts = state.posts.filter((post) => post.id !== id);
        // state.posts = posts;

        postsAdapter.removeOne(state, id);
      });
  },
});

// getSelectors creates these selectors and we rename them
// with aliases using destructuring

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
  // Pass in a selector that returns the posts slice of state
} = postsAdapter.getSelectors((state) => {
  console.log(state);
  return state.posts;
});

export const getPostsStatus = (state) => state.posts.status;
export const getPostsError = (state) => state.posts.error;
export const getCount = (state) => state.posts.count;

// createSelector accepts one or more input functions
// The values returned from these functions are dependencies.
// They provide input parameters for the output function of our memoized selector.
// i.e. if selectAllPosts returns a different result or the anonymous function
// returns a different userId, only then the posts.filter is re-computed
export const selectPostByUser = createSelector(
  [selectAllPosts, (state, userId) => userId],
  (posts, userId) => posts.filter((post) => post.userId === userId)
);

export const { postAdded, reactionAdded, increaseCount } = postsSlice.actions; // actions are got from createSlice above
export default postsSlice.reducer;
