import { h, VNode } from 'preact';
import { route } from 'preact-router';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useNavKeys } from '../hooks/useNavKeys';
import { ApiService } from '../core/services/apiService';
import { ListItem, View } from '../ui-components';
import { NavItem, setSelected, wrapItems } from '../utils/navigation';
import { useDpad } from '../hooks/useDpad';
import styles from './Search.module.css';
import { ITunesPodcast } from '../core/models';

const apiService = new ApiService();

interface SearchProps {
  q?: string;
  selectedItemId?: string;
}

export default function Search({
  q: queryParam,
  selectedItemId,
}: SearchProps): VNode {
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<NavItem<ITunesPodcast>[]>([]);
  const searchbox = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchbox.current?.focus();
    setItems([]);
    if (!queryParam) return;

    setQuery(queryParam);
    searchbox.current?.blur();

    apiService
      .search(queryParam)
      .then((result) => setItems(wrapItems(result, 'collectionId')))
      .catch((err) => console.error(err));
  }, [queryParam]);

  // Restore scroll position
  useEffect(() => {
    if (!selectedItemId) return;

    const selected = items.find((a) => a.id === selectedItemId);
    if (selected && !selected.isSelected) {
      setItems(setSelected(items, selectedItemId));
    }
  }, [selectedItemId, items]);

  function viewPodcast(podcastStoreId: number): void {
    route(`/search/${podcastStoreId}`);
  }

  function setQueryParam(): void {
    route(query ? `/search?q=${query}` : '/search');
  }

  useDpad({
    items,
    onEnter: (item) => viewPodcast(item.data.collectionId),
    onChange: (items) => {
      const selected = items.find((a) => a.isSelected);
      if (selected) {
        route(`/search?q=${queryParam}&selectedItemId=${selected.id}`, true);
      } else {
        route(`/search?q=${queryParam}`, true);
      }
      setItems(items);
    },
    options: { stopPropagation: true },
  });

  useNavKeys(
    {
      Enter: (ev: KeyboardEvent) => {
        if ((ev.target as HTMLElement).tagName === 'INPUT') {
          setQueryParam();
          ev.stopImmediatePropagation();
        }
      },
      ArrowUp: (ev: KeyboardEvent) => {
        const noneSelected = !items.some((a) => a.isSelected);
        if (noneSelected) {
          searchbox.current?.focus();
          ev.stopImmediatePropagation();
        }
      },
      ArrowDown: () => {
        searchbox.current?.blur();
      },
      SoftRight: () => {
        searchbox.current?.focus();
      },
    },
    { allowInInputs: true }
  );

  function handleQueryChange(ev: any): void {
    if (ev.target.value !== query) {
      setQuery(ev.target.value);
    }
  }

  function getCenterText(): string {
    if (document.activeElement === searchbox.current) {
      return 'Search';
    }

    if (items.some((a) => a.isSelected)) {
      return 'Select';
    }

    return '';
  }

  return (
    <View
      headerText="Search"
      centerMenuText={getCenterText()}
      rightMenuText="Search"
    >
      <input
        id="search"
        type="text"
        className={styles.searchBox}
        placeholder="Search..."
        value={query}
        ref={searchbox}
        onChange={handleQueryChange}
        onInput={handleQueryChange}
      />
      {items.map((item) => (
        <ListItem
          key={item.data.collectionId}
          ref={item.ref}
          isSelected={item.isSelected}
          imageUrl={item.data.artworkUrl60}
          primaryText={item.data.collectionName}
          secondaryText={item.data.artistName}
          onClick={(): void => viewPodcast(item.data.collectionId)}
        />
      ))}
    </View>
  );
}
