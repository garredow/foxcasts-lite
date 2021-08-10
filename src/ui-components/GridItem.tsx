import { h } from 'preact';
import { forwardRef } from 'preact/compat';
import { ComponentBaseProps } from '../models';
import { ifClass, joinClasses } from '../utils/classes';
import styles from './GridItem.module.css';

type Props = ComponentBaseProps & {
  isSelected?: boolean;
  dimIfUnselected?: boolean;
  shortcutKey?: string | number;
  imageUrl: string;
  onClick?: () => void;
};

export const GridItem = forwardRef(
  (
    { isSelected = false, dimIfUnselected = false, ...props }: Props,
    ref: any
  ) => {
    return (
      <img
        ref={ref}
        className={joinClasses(
          styles.root,
          ifClass(isSelected, styles.selected),
          ifClass(dimIfUnselected && !isSelected, styles.dim)
        )}
        src={props.imageUrl}
      />
    );
  }
);
