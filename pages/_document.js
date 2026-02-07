import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta property="og:title" content="Date a Bot or Not" key="title" />
        <meta
          property="og:description"
          content="A consent-forward robo-human dating lab with 5-minute Jitsi test dates."
          key="description"
        />
        <meta property="og:image" content="/bots/bot-1.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
