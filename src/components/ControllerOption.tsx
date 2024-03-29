import { SelectableBase } from 'mai-ui/dist/components/SelectableBase';
import { IconSize, SvgIcon } from 'mai-ui/dist/components/SvgIcon';
import { useNavKeys } from 'mai-ui/dist/hooks';
import { h } from 'preact';
import { ComponentBaseProps, SelectableProps } from '../models';
import { ifClass, joinClasses } from '../utils/classes';
import styles from './ControllerOption.module.css';

type Props = ComponentBaseProps &
  SelectableProps & {
    label: string;
    disabled?: boolean;
    leftAction: () => void;
    rightAction: () => void;
    centerAction?: () => void;
  };

export function ControllerOption(props: Props): h.JSX.Element {
  useNavKeys(
    {
      ArrowLeft: () => {
        props.leftAction();
        return true;
      },
      ArrowRight: () => {
        props.rightAction();
        return true;
      },
      Enter: () => {
        if (props.centerAction) {
          props.centerAction();
          return true;
        }
      },
    },
    {
      capture: true,
      disabled: !props.selectable?.selected || props.disabled,
      stopPropagation: true,
    }
  );

  return (
    <SelectableBase
      {...props.selectable}
      className={joinClasses(
        styles.root,
        ifClass(props.selectable?.selected, styles.selected),
        ifClass(props.disabled, styles.disabled)
      )}
    >
      <SvgIcon icon="chevronLeft" size={IconSize.Small} />
      <div className={styles.label}>{props.label}</div>
      <SvgIcon icon="chevronRight" size={IconSize.Small} />
    </SelectableBase>
  );
}
