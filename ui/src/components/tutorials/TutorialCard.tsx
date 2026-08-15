/**
 * One tutorial in the results grid.
 *
 * Deliberately the same shape as `.robot-card` in the chat panel — 10px
 * radius, hairline rule above the figures, mono numerals — so a tutorial and a
 * part read as two views of one catalogue.
 *
 * The thumbnail carries a runtime and nothing else. It used to carry a format
 * pill and a verified badge too, but twelve of the fourteen tutorials are
 * verified, so that badge marked almost every card and distinguished none of
 * them; and the format belongs in the body line, where it is read rather than
 * decoded.
 */

import React from 'react';
import { Tutorial } from '../../types';
import Price from './Price';
import {
  FORMAT_LABEL,
  formatRuntime,
  kitTotal,
  lengthLabel,
  partCount,
} from './format';

interface TutorialCardProps {
  tutorial: Tutorial;
}

const TutorialCard: React.FC<TutorialCardProps> = ({ tutorial }) => {
  const parts = partCount(tutorial);

  return (
    <li>
      <article className="tut-card">
        <div className="tut-card__media">
          <img src={tutorial.image} alt="" />
          {tutorial.runtimeSec !== null && (
            <span className="tut-card__runtime">
              {formatRuntime(tutorial.runtimeSec)}
            </span>
          )}
        </div>

        <div className="tut-card__body">
          <h3 className="tut-card__title">
            <a href={'#' + tutorial.id}>{tutorial.title}</a>
          </h3>

          <p className="tut-card__meta">
            {FORMAT_LABEL[tutorial.format]} · {tutorial.category}
          </p>

          <ul className="tut-card__chips">
            <li className="tut-card__chip tut-card__chip--level">
              {tutorial.level}
            </li>
            {tutorial.platforms.slice(0, 2).map((platform) => (
              <li key={platform} className="tut-card__chip">
                {platform}
              </li>
            ))}
          </ul>

          <p className="tut-card__length">{lengthLabel(tutorial)}</p>

          <div className="tut-card__kit">
            <span className="tut-card__amount">
              <Price amount={kitTotal(tutorial)} />
            </span>
            <span className="tut-card__parts">
              {parts} {parts === 1 ? 'part' : 'parts'}
            </span>
          </div>
        </div>
      </article>
    </li>
  );
};

export default TutorialCard;
