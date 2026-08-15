/**
 * The featured build.
 *
 * Half photograph, half bill of materials. A course site can show you the
 * lesson and a parts shop can show you the price; the point of this product is
 * that one page does both, so the hero is the tutorial *with its receipt*.
 */

import React from 'react';
import { Tutorial } from '../../types';
import Price from './Price';
import { kitTotal } from './format';

interface FeaturedTutorialProps {
  tutorial: Tutorial;
}

const FeaturedTutorial: React.FC<FeaturedTutorialProps> = ({ tutorial }) => (
  <article className="tut-featured">
    <div className="tut-featured__media">
      <img src={tutorial.image} alt="" />
    </div>

    <div className="tut-featured__body">
      <p className="tut-eyebrow">Featured build</p>


      <h2 className="tut-featured__title">{tutorial.title}</h2>
      <p className="tut-featured__summary">{tutorial.summary}</p>

      <section className="tut-bom">
        {/* The currency is named once at the head of the column. Repeating
            "Rs" down six rows adds no information and costs the figures their
            alignment. */}
        <div className="tut-bom__head">
          <h3 className="tut-bom__legend">What you need</h3>
          <span className="tut-bom__unit">PKR</span>
        </div>

        <table className="tut-bom__table">
          <tbody>
            {tutorial.parts.map((part) => (
              <tr key={part.name}>
                <td className="tut-bom__name">{part.name}</td>
                {/* A quantity of one is the default, so it goes unsaid. */}
                <td className="tut-bom__qty">
                  {part.qty > 1 ? '×' + part.qty : ''}
                </td>
                <td className="tut-bom__cost">
                  <Price amount={part.qty * part.price} showUnit={false} />
                </td>
              </tr>
            ))}
            <tr className="tut-bom__total">
              <td className="tut-bom__name">Kit total</td>
              <td className="tut-bom__qty" />
              <td className="tut-bom__cost">
                <Price amount={kitTotal(tutorial)} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="tut-featured__actions">
        <button type="button" className="tut-button">
          Start tutorial
        </button>
        <button type="button" className="tut-button tut-button--quiet">
          Add the kit to cart
        </button>
      </div>
    </div>
  </article>
);

export default FeaturedTutorial;
