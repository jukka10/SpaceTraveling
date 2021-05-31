import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import { readTime } from '../../utils/readTime';
import styles from './post.module.scss';
import { useEffect } from 'react';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: { url: string };
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
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', true);
    script.setAttribute('repo', '[jukka10/ignite-desafio05]');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-light');
    anchor.appendChild(script);
  }, []);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${post.data.title} | spacetraveling`}</title>
      </Head>

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />

      <article className={styles.container}>
        <strong className={styles.title}>{post.data.title}</strong>

        <div className={styles.postInfo}>
          <div>
            <FiCalendar size={20} />
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
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
        <time className={styles.lastDate}>
          * editado em{' '}
          {format(new Date(post.last_publication_date), 'dd MMM yyyy', {
            locale: ptBR,
          })}{' '}
          as,{' '}
          {`${new Date(post.last_publication_date).getHours()}:${new Date(
            post.last_publication_date
          ).getMinutes()}`}
        </time>
        <section className={styles.content}>
          {post.data.content.map(({ heading, body }, index) => (
            <div key={String(index)}>
              <h2>{heading}</h2>
              <div
                className={styles.boxContent}
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
              />
            </div>
          ))}
        </section>
      </article>

      <aside className={styles.otherPosts}>
        <nav>
          <div>
            <span>Como utilizar Hooks</span>
            <Link href="/">Post anterior</Link>
          </div>
          <div className={styles.boxNextPost}>
            <span>Criando um app</span>
            <Link href="/">Próximo post</Link>
          </div>
        </nav>
      </aside>
      <div id="inject-comments-for-uterances"></div>
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

  const Title = Array.isArray(title) ? RichText.asText(title) : title;

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: Title,
      banner: { url: banner.url },
      author,
      content: content.map(({ heading, body }) => {
        return {
          heading,
          body,
        };
      }),
      subtitle: response.data.subtitle,
    },
  };

  return {
    props: { post },
    revalidate: 60 * 60, // 1 hora
  };
};
