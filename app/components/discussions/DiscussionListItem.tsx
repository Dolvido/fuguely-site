import Paper from '@mui/material/Paper';
import { observer } from 'mobx-react';
import Link from 'next/link';
import React from 'react';

import { Store } from '../../lib/store';
import { Discussion } from '../../lib/store/discussion';
import { Studio } from '../../lib/store/studio';

import DiscussionActionMenu from './DiscussionActionMenu';

type Props = {
  store: Store;
  discussion: Discussion;
  studio: Studio;
  isMobile: boolean;
};

class DiscussionListItem extends React.Component<Props> {
  public render() {
    const { store, discussion, studio, isMobile } = this.props;
    const trimmingLength = 16;

    const selectedDiscussion =
      store.currentUrl === `/studios/${studio.slug}/discussions/${discussion.slug}`;

    // console.log(store.currentUrl);

    const isThemeDark = store && store.currentUser && store.currentUser.darkTheme === true;

    const selectedItemBorder = isThemeDark
      ? '1px rgba(255, 255, 255, 0.75) solid'
      : '1px rgba(0, 0, 0, 0.75) solid';

    return (
      <Paper
        key={discussion._id}
        style={{
          margin: '10px 10px 5px 0px',
          padding: '8px',
          border: selectedDiscussion ? selectedItemBorder : 'none',
        }}
        elevation={selectedDiscussion ? 24 : 1}
      >
        <li key={discussion._id} style={{ whiteSpace: 'nowrap', paddingRight: '10px' }}>
          <Link
            scroll={false}
            href={`/discussion?studioSlug=${studio.slug}&discussionSlug=${discussion.slug}`}
            as={`/studios/${studio.slug}/discussions/${discussion.slug}`}
          >
            <a
              style={{ fontWeight: 300, color: isThemeDark ? '#fff' : '#000' }}
              key={discussion._id}
            >
              {discussion.name.length > trimmingLength
                ? `${discussion.name.substring(0, trimmingLength)}...`
                : discussion.name}
            </a>
          </Link>
          <div
            style={{
              float: 'right',
              marginRight: '-12px',
            }}
          >
            <DiscussionActionMenu discussion={discussion} isMobile={isMobile} store={store} />
          </div>
        </li>
      </Paper>
    );
  }
}

export default observer(DiscussionListItem);
