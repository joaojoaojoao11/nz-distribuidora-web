import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/SEO/SEO';
import { SITE_URL, SITE_NAME, SITE_LOGO } from '../../lib/siteConfig';
import NotFound from '../NotFound';
import styles from './Blog.module.css';

interface FaqItem {
  question: string;
  answer: string;
}

interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  focus_keyword: string;
  cover_image_url: string;
  published_at: string;
  author: string;
  categories: any;
  faq?: FaqItem[] | null;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`*, categories:category_id (name)`)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPost(data as BlogPostDetail);
      setLoading(false);
    }
    setNotFound(false);
    setLoading(true);
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.blogPage} style={{ paddingTop: '120px' }}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (notFound || !post) return <NotFound />;

  const faqItems: FaqItem[] = Array.isArray(post.faq)
    ? post.faq.filter(f => f && f.question && f.answer)
    : [];

  const articleSchema: Record<string, unknown> = {
    "@type": "Article",
    "headline": post.title,
    "image": post.cover_image_url ? [post.cover_image_url] : [],
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "mainEntityOfPage": `${SITE_URL}/blog/${post.slug}`,
    "author": [{
      "@type": "Person",
      "name": post.author,
      "url": `${SITE_URL}/sobre`
    }],
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": SITE_LOGO
      }
    },
    "description": post.meta_description
  };

  const graph: Record<string, unknown>[] = [articleSchema];
  if (faqItems.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "mainEntity": faqItems.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))
    });
  }

  const schema = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });

  return (
    <div className={styles.blogPage}>
      <SEO
        title={post.title}
        description={post.meta_description || post.title}
        keywords={post.focus_keyword || "envelopamento ppf, nz distribuidora, blog automotivo"}
        canonicalUrl={`/blog/${post.slug}`}
        imageUrl={post.cover_image_url}
        type="article"
        schema={schema}
      />

      <main className={`container ${styles.postDetail}`}>
        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <header className={styles.postHeader}>
            {post.categories?.name && (
              <Link to="/blog" className={styles.postCategory}>
                {post.categories.name}
              </Link>
            )}
            <h1 className={styles.postTitle}>{post.title}</h1>
            <div className={styles.postMeta}>
              <span>Escrito por <strong>{post.author}</strong></span>
              <span className={styles.postMetaDot}>•</span>
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </time>
            </div>
          </header>

          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className={styles.postCover}
              loading="lazy"
            />
          )}

          <div className={styles.postContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {faqItems.length > 0 && (
            <section className={styles.postContent} aria-label="Perguntas frequentes">
              <h2>Perguntas frequentes</h2>
              {faqItems.map((f, i) => (
                <details key={i} style={{ marginBottom: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{f.question}</summary>
                  <p style={{ marginTop: '8px' }}>{f.answer}</p>
                </details>
              ))}
            </section>
          )}
        </motion.article>
      </main>
    </div>
  );
}
