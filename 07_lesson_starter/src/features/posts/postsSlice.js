import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { sub } from "date-fns";
import { apiSlice } from "../api/apiSlice";

const postsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState();

export const extendedApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => "/posts",
      transformResponse: (responseData) => {
        let min = 1;
        const loadedPosts = responseData.map((post) => {
          if (!post?.date)
            post.date = sub(new Date(), { minutes: min++ }).toISOString();
          if (!post?.reactions)
            post.reactions = {
              thumbsUp: 0,
              wow: 0,
              heart: 0,
              rocket: 0,
              coffee: 0,
            };

          return post;
        });
        return postsAdapter.setAll(initialState, loadedPosts);
      },

      // providesTags is an array.
      // In the first entry, we are just identifying it as a list.
      // The type is Post. That just means we are identifying list and
      // any time that we invalidate one of these tags, it will re-fetch all
      // the posts again. So if we want to get the full list, we can just invalidate
      // the List id.
      // But what we are also doing now is providing an object for each separat
      // individual post, passing the id from the post. We are doing that by mapping
      // over the result and also spreading into individual post ids here.
      // So if any one of those post ids are invalidated, it will also re fetch the
      // list automatically and that's what providesTags does.
      providesTags: (result, error, arg) => [
        { type: "Post", id: "List" },
        ...result.ids.map((id) => ({ type: "Post", id })),
      ],
    }),
    getPostsByUserId: builder.query({
      query: (id) => `/posts/?userId=${id}`,
      transformResponse: (responseData) => {
        let min = 1;
        const loadedPosts = responseData.map((post) => {
          if (!post?.date)
            post.date = sub(new Date(), { minutes: min++ }).toISOString();
          if (!post?.reactions)
            post.reactions = {
              thumbsUp: 0,
              wow: 0,
              heart: 0,
              rocket: 0,
              coffee: 0,
            };

          return post;
        });
        return postsAdapter.setAll(initialState, loadedPosts);
      },

      // Much like above, we are not giving id of full list.
      // We are spreading the result thats ran through the map.
      // If any of the posts get invalidated in the future, it
      // would invalidate the cache and refetch
      providesTags: (result, error, arg) => {
        console.log(result);
        return [...result.ids.map((id) => ({ type: "Post", id }))];
      },
    }),
    addNewPost: builder.mutation({
      query: (initialPost) => ({
        url: "/posts",
        method: "POST",
        body: {
          ...initialPost,
          userId: Number(initialPost.userId),
          date: new Date().toISOString(),
          reactions: {
            thumbsUp: 0,
            wow: 0,
            heart: 0,
            rocket: 0,
            coffee: 0,
          },
        },
      }),
      // The difference here from the queries as we are performing
      // mutation is we are using invalidatesTags, instead of providesTags.
      // This is going to invalidate the list, there is no individual post,
      // because this post didnt already exist. But it would be part of the
      // list, so this should invalidate the post list cache.
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),
    updaePost: builder.mutation({
      query: (initialPost) => ({
        url: `/posts/${initialPost.id}`,
        method: "PUT",
        body: {
          ...initialPost,
          date: new Date().toISOString(),
        },
      }),
      // This will invalidate the cache for whichever post id was there.
      invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
    }),

    deletePost: builder.mutation({
      query: ({ id }) => ({
        url: ```/posts/${id}`,
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
    }),

    addReaction: builder.mutation({
      query: ({ postId, reactions }) => ({
        url: `posts/${postId}`,
        method: "PATCH",
        body: { reactions },
      }),

      // first argument is the params passed, and second is the object
      // of dispatch and queryFulfilled which is a promise
      async onQueryStarted(
        { postId, reactions },
        { dispatch, queryFulfilled }
      ) {
        // updateQueryData requires the endpoint name and cache key arguments,
        // so it knows which piece of cache state to update
        const patchResult = dispatch(
          extendedApiSlice.util.updateQueryData(
            "getPosts",
            undefined,
            (draft) => {
              // The draft is Immer-wrapped and can be mutated like in createSlice
              const post = draft.entities[postId];
              if (post) post.reactions = reactions;
            }
          )
        );

        // we await for the promise to be fulfilled. Otherwise we will undo the patch.
        // That is because this is an optimistic update. So what we are really doing is
        // updating our cache and that is happening optimistically, probably before the
        // api has been updated. So we are instantly seeing on ui. So if it fails,
        // we just undo the cache.
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
        // we are not invalidatesTags because we do not want to refetch
        // list every time a reaction is added
      },
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostsByUserIdQuery,
  useAddNewPostMutation,
  useUpdaePostMutation,
  useDeletePostMutation,
  useAddReactionMutation,
} = extendedApiSlice;

// returns the query result object
export const selectPostResult = extendedApiSlice.endpoints.getPosts.select();

// Creates memoized selector
const selectPostsData = createSelector(
  selectPostResult,
  (postsResult) => postsResult.data // Normalized state object with ids and entities
);

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
  // Pass in a selector that returns the posts slice of state
} = postsAdapter.getSelectors(
  (state) => selectPostsData(state) ?? initialState
);
