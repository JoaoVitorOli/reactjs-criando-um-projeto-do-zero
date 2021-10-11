import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from "next/head";
import { RichText } from 'prismic-dom';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import Prismic from "@prismicio/client";

import Header from "../../components/Header";

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

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
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }
  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>

      <div className={styles.headerWrapper}>
        <Header />
      </div>

      <main className={styles.container}>
        {!post ? (
          <p>Carregando...</p>
        ) : (
          <>
            <img
              src={post.data.banner.url}
              alt="banner"
              className={styles.banner}
            />

            <div className={styles.wrapper}>
              <h1 className={styles.title}>{post.data.title}</h1>

              <div className={styles.infoContainer}>
                <div className={styles.info}>
                  <FiCalendar color="#BBBBBB" size={18} />
                  <span>
                    {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <div className={styles.info}>
                  <FiUser color="#BBBBBB" size={18} />
                  <span>{post.data.author}</span>
                </div>
                <div className={styles.info}>
                  <FiClock color="#BBBBBB" size={18} />
                  <span>4 min</span>
                </div>
              </div>
              
              {post.data.content.map(postContent => {
                return (
                  <div key={postContent.heading}>
                    <h3 className={styles.subtitle}>{postContent.heading}</h3>
                    <div
                      className={styles.postContent}
                      dangerouslySetInnerHTML={{
                        __html: RichText.asHtml(postContent.body),
                      }}
                    />
                  </div>
                );
              })}
            </div>

          </>
        )}
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at("document.type", "post")
  ], {
    pageSize: 2,
  });

  const paths = posts.results.map(post => ({
    params: { slug: post.uid }
  }))

  return {
    paths,
    fallback: "blocking"
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID("post", String(slug), {});

  console.log("response.data");
  console.log(response.data.content[0].body);

  return {
    props: { post: response },
    revalidate: 60 * 10 // 10 minutos
  }
};
