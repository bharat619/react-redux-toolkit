import { useSelector } from "react-redux";
import { selectPostById } from "./postsSlice";
import { useParams } from "react-router";

import PostAuthor from "./PostAuthor";
import TimeAgo from "./TimeAgo";
import ReactionButton from "./ReactionButtons";
import { Link } from "react-router-dom";

const SinglePostPage = () => {
  const { postId } = useParams();

  const post = useSelector((state) => selectPostById(state, Number(postId)));

  if (!post) {
    return (
      <section>
        <h2>Post Not Found!</h2>
      </section>
    );
  }

  return (
    <article>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
      <p className="postCredit">
        <Link to={`/posts/${post.id}/edit`}>Edit Post</Link>
        <PostAuthor userId={post.userId} />
        <TimeAgo timeStamp={post.date} />
        <ReactionButton post={post} />
      </p>
    </article>
  );
};

export default SinglePostPage;
