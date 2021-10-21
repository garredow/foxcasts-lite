import { h, VNode } from 'preact';
import { SelectablePriority, useDpad } from '../hooks/useDpad';
import { useNavKeys } from '../hooks/useNavKeys';
import { ComponentBaseProps } from '../models';
import { ifClass, joinClasses } from '../utils/classes';
import styles from './Menu.module.css';
import { useListNav } from '../hooks/useListNav';
import { SvgIcon } from './SvgIcon';
import { Typography } from './Typography';
import { SelectableBase } from './hoc';

export type MenuOption = {
  id: string;
  label: string;
  disabled?: boolean;
};
type Props = ComponentBaseProps & {
  options: MenuOption[];
  title?: string;
  onSelect?: (menuOptionId: any) => void;
};

export function Menu({ options = [], ...props }: Props): VNode {
  const { selectedId } = useListNav({
    priority: SelectablePriority.Medium,
    onSelect: (itemId) => {
      if (itemId) props.onSelect?.(itemId);
    },
  });

  return (
    <div className={styles.root}>
      <Typography type="bodyStrong">{props.title}</Typography>
      <div className={styles.options}>
        {options.map((option, i) => (
          <SelectableBase
            key={option.id}
            className={joinClasses(
              styles.option,
              ifClass(!!option.disabled, styles.disabled)
            )}
            priority={SelectablePriority.Medium}
            id={option.id}
            shortcut={i + 1 <= 9 ? i + 1 : undefined}
            selected={selectedId === option.id}
          >
            <div className={styles.shortcut}>{i + 1}</div>
            {option.label}
          </SelectableBase>
        ))}
      </div>
      <div className={styles.bar}>
        <SvgIcon icon="cancel" />
      </div>
    </div>
  );
}
