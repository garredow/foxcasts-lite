import { h, VNode } from 'preact';
import { ComponentBaseProps } from '../models';
import { joinClasses } from '../utils/classes';
import Cancel from './icons/cancel.svg';
import ChevronDown from './icons/chevron_down.svg';
import ChevronLeft from './icons/chevron_left.svg';
import ChevronRight from './icons/chevron_right.svg';
import ChevronUp from './icons/chevron_up.svg';
import Download from './icons/download.svg';
import Grid from './icons/grid.svg';
import Home from './icons/home.svg';
import List from './icons/list.svg';
import Menu from './icons/menu.svg';
import MoreVert from './icons/more_vert.svg';
import Play from './icons/play.svg';
import Search from './icons/search.svg';
import Settings from './icons/settings.svg';
import styles from './SvgIcon.module.css';

export type IconName =
  | 'cancel'
  | 'download'
  | 'grid'
  | 'home'
  | 'list'
  | 'menu'
  | 'moreVert'
  | 'play'
  | 'search'
  | 'settings'
  | 'chevronUp'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight';

export type IconSize = 'small' | 'medium' | 'large';

type Props = ComponentBaseProps & {
  icon: IconName;
  size?: IconSize;
};

export function SvgIcon({ icon, size = 'medium', ...props }: Props): VNode {
  function getIcon() {
    switch (icon) {
      case 'cancel':
        return Cancel;
      case 'download':
        return Download;
      case 'grid':
        return Grid;
      case 'home':
        return Home;
      case 'list':
        return List;
      case 'menu':
        return Menu;
      case 'moreVert':
        return MoreVert;
      case 'play':
        return Play;
      case 'search':
        return Search;
      case 'settings':
        return Settings;
      case 'chevronUp':
        return ChevronUp;
      case 'chevronDown':
        return ChevronDown;
      case 'chevronLeft':
        return ChevronLeft;
      case 'chevronRight':
        return ChevronRight;
    }
  }
  return (
    <img
      className={joinClasses(styles[size], props.className)}
      src={getIcon()}
    />
  );
}