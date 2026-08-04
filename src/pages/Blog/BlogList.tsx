import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import styles from './Blog.module.css';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  cover_image_url: string;
  category_id?: string;
  published_at: string;
  author: string;
  categories?: any;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          id, slug, title, meta_description, cover_image_url, published_at, author,
          categories:category_id (name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (data && !error) {
        setPosts(data as BlogPost[]);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog NZ Distribuidora - Tudo sobre Envelopamento PPF e Premium Wrap",
    "url": `${SITE_URL}/blog`,
    "description": "Veja artigos, novidades e tutoriais avançados sobre aplicação de PPF e adesivos automotivos produzidos pelos especialistas da NZ."
  });

  return (
    <div className={styles.blogPage}>
      <SEO 
        title="Blog - Tudo sobre PPF e Envelopamento Premium"
        description="Fique por dentro das novidades, tutoriais de aplicação e vantagens do Envelopamento PPF e Vinil Automotivo com o Blog da NZ Distribuidora."
        keywords="blog ppf, dicas de envelopamento, como aplicar ppf, vantagens do ppf, noticias automotivas"
        canonicalUrl="/blog"
        schema={schema}
      />
      
      <header className={styles.blogHeader}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className={styles.blogTitle}>A REVISTA DO INSTALADOR</h1>
          <p className={styles.blogSubtitle}>Conhecimento, mercado e técnicas exclusivas sobre PPF e Premium Wraps.</p>
        </motion.div>
      </header>

      <main className={`container ${styles.blogContainer}`}>
        {loading ? (
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.spinnerContainer}>
            <p style={{ color: '#777' }}>Nenhum artigo publicado ainda. Fique de olho!</p>
          </div>
        ) : (
          <motion.div 
            className={styles.blogGrid}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {posts.map(post => (
              <motion.div key={post.id} variants={itemVariants}>
              <Link
                to={`/blog/${post.slug}`}
                className={styles.blogCard}
                style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}
              >
                {post.cover_image_url && (
                  <img src={post.cover_image_url} alt={post.title} className={styles.blogCardImage} loading="lazy" />
                )}
                <div className={styles.blogCardContent}>
                  {post.categories?.name && (
                    <span className={styles.blogCardCategory}>{post.categories.name}</span>
                  )}
                  <h2 className={styles.blogCardTitle}>{post.title}</h2>
                  <p className={styles.blogCardExcerpt}>{post.meta_description || 'Leia mais sobre este artigo.'}</p>
                  
                  <div className={styles.blogCardFooter}>
                    <span>{post.author}</span>
                    <span>
                      {new Date(post.published_at).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
