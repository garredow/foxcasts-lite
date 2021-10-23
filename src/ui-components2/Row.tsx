import { h } from 'preact';
import { ComponentBaseProps } from '../models';
import styles from './Row.module.css';

type Props = ComponentBaseProps & {
  layout: 'vertical' | 'horizontal';
};

export function Row(props: Props): h.JSX.Element {
  return (
    <div className={styles.root}>
      <div className={styles.label}>{props.label}</div>
      <div className={styles.text}>{props.text}</div>
    </div>
  );
}
