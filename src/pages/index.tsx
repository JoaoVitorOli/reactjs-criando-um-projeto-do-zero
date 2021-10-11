import { GetStaticProps } from 'next';
import Head from "next/head";
import Prismic from "@prismicio/client";
import { FiCalendar, FiUser } from "react-icons/fi";
import Link from "next/link";
import ptBR from 'date-fns/locale/pt-BR';

import Header from "../components/Header";

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';
import { useState } from 'react';
import { format } from 'date-fns';


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

  async function handleFetchMorePosts() {
    const response = await fetch(nextPage).then(data =>
      data.json()
    );

    const morePosts = response.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(new Date(post.first_publication_date), 'dd MMM yyyy',
        {
          locale: ptBR,
        }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }
    });

    setPosts([...posts, ...morePosts.map(post => post)]);
    setNextPage(response.next_page);
  }

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>

      <div className={styles.wrapper}>
        <Header />
        
        <main className={styles.container}>
          <div className={styles.postList}>
            {posts.map(post => (
              <Link
                href={`/post/${post.uid}`}
                key={post.uid}
              >
                <div className={styles.post}>
                  <span>{post.data.title}</span>
                  <p className={styles.subtitle}>{post.data.subtitle}</p>

                  <div className={styles.info}>
                    <div>
                      <FiCalendar color="#BBBBBB" size={18} />
                      <p>
                        {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div>
                      <FiUser color="#BBBBBB" size={18} />
                      <p>{post.data.author}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {typeof nextPage === "string" && (
            <button
              type="button"
              onClick={handleFetchMorePosts}
              className={styles.button}
            >
              Carregar mais posts
            </button>
          )}
        </main>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at("document.type", "post")
  ], {
    pageSize: 2,
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results
  }

  return {
    props: {
      postsPagination
    },
    revalidate: 60 * 10, // 10 minutos
  }
};
