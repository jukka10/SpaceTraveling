import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import { readTime } from '../../utils/readTime';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const time = readTime(post.data.content);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <article className={styles.container}>
        <strong className={styles.title}>{post.data.title}</strong>

        <div className={styles.postInfo}>
          <div>
            <FiCalendar size={20} />
            <time>{post.first_publication_date}</time>
          </div>

          <div>
            <FiUser size={20} />
            <p>{post.data.author}</p>
          </div>

          <div>
            <FiClock size={20} />
            <p>{time}</p>
          </div>
        </div>

        <section className={styles.content}>
          {post.data.content.map(({ heading, body }) => (
            <div>
              <strong>{heading}</strong>

              <div
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
              />
            </div>
          ))}
        </section>
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post')
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const { title, author, banner, content } = response.data;

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: RichText.asText(title),
      banner: {
        url: banner.url,
      },
      author,
      content: content.map(({ heading, body }) => ({
        heading,
        body,
      })),
    },
  };

  return {
    props: { post },
    revalidate: 60 * 60, // 1 hora
  };
};
