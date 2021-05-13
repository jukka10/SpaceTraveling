import { RichText } from 'prismic-dom';

interface ContentProps {
  heading: string;
  body: {
    text: string;
  }[];
}

export function readTime(content: ContentProps[]) {
  const result = content.map(({ heading, body }) => {
    const numberWordsHeading = heading.split(/\s/g).length;
    const numberWordsBody = RichText.asHtml(body).split(/\s/g).length;

    return numberWordsBody + numberWordsHeading;
  });

  const time = result[0] / 200;

  return `${Math.ceil(time + 3)} min`;
}
