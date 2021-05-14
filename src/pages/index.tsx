import Head from 'next/head';
import Link from 'next/link';
import Primic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';

import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMorePosts() {
    if (nextPage === null) {
      return;
    }

    const response = await fetch(nextPage);
    const postsResult = await response.json();

    const newPosts = postsResult.results.map(post => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setNextPage(postsResult.next_page);
    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetravling</title>
      </Head>
      <main className={styles.container}>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.content}>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>

              <div className={styles.postInfo}>
                <div>
                  <FiCalendar size={20} />
                  <time>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                </div>

                <div>
                  <FiUser size={20} />
                  <p>{post.data.author}</p>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {nextPage && (
          <button onClick={handleLoadMorePosts} type="button">
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Primic.Predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: { next_page: postsResponse.next_page, results: posts },
    },
  };
};
