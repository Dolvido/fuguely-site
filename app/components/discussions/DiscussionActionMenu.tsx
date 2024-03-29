import { observer } from 'mobx-react';
import NProgress from 'nprogress';
import React from 'react';

import confirm from '../../lib/confirm';
import notify from '../../lib/notify';
import { Store } from '../../lib/store';
import { Discussion } from '../../lib/store/discussion';

import MenuWithMenuItems from '../common/MenuWithMenuItems';
import EditDiscussionForm from './EditDiscussionForm';

const dev = process.env.NODE_ENV !== 'production';

const getMenuOptions = (discussion) => ({
  dataId: discussion._id,
  id: `discussion-menu-${discussion._id}`,
});

const getMenuItemOptionsForCreator = (discussion, component) => [
  {
    text: 'Copy URL',
    dataId: discussion._id,
    onClick: component.handleCopyUrl,
  },
  {
    text: 'Edit',
    dataId: discussion._id,
    onClick: component.editDiscussion,
  },
  {
    text: 'Delete',
    dataId: discussion._id,
    onClick: component.deleteDiscussion,
  },
];

const getMenuItemOptions = (discussion, component) => [
  {
    text: 'Copy URL',
    dataId: discussion._id,
    onClick: component.handleCopyUrl,
  },
];

type Props = {
  discussion: Discussion;
  store: Store;
  isMobile: boolean;
};

type State = {
  discussionFormOpen: boolean;
  selectedDiscussion: Discussion;
};

class DiscussionActionMenu extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      discussionFormOpen: false,
      selectedDiscussion: null,
    };
  }

  public render() {
    const { discussion, store } = this.props;
    const { currentUser } = store;

    const isCreator = currentUser._id === discussion.createdUserId ? true : false;

    return (
      <React.Fragment>
        <MenuWithMenuItems
          menuOptions={getMenuOptions(discussion)}
          itemOptions={
            isCreator
              ? getMenuItemOptionsForCreator(discussion, this)
              : getMenuItemOptions(discussion, this)
          }
        />

        {this.state.discussionFormOpen ? (
          <EditDiscussionForm
            open={true}
            onClose={this.handleDiscussionFormClose}
            discussion={discussion}
            isMobile={this.props.isMobile}
            store={store}
          />
        ) : null}
      </React.Fragment>
    );
  }

  public handleCopyUrl = async (event) => {
    const { store } = this.props;
    const { currentStudio } = store;

    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }

    const selectedDiscussion = currentStudio.discussions.find((d) => d._id === id);

    const discussionUrl = `${
      dev ? process.env.NEXT_PUBLIC_URL_APP : process.env.NEXT_PUBLIC_PRODUCTION_URL_APP
    }/studios/${currentStudio.slug}/discussions/${selectedDiscussion.slug}`;

    try {
      if (window.navigator) {
        await window.navigator.clipboard.writeText(discussionUrl);
        notify('You successfully copied URL.');
      }
    } catch (err) {
      notify(err);
    } finally {
      this.setState({ discussionFormOpen: false, selectedDiscussion: null });
    }
  };

  public editDiscussion = (event) => {
    const { currentStudio } = this.props.store;
    if (!currentStudio) {
      notify('You have not selected Studio.');
      return;
    }

    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }

    const selectedDiscussion = currentStudio.discussions.find((d) => d._id === id);

    this.setState({ discussionFormOpen: true, selectedDiscussion });
  };

  public deleteDiscussion = async (event) => {
    const { currentStudio } = this.props.store;
    if (!currentStudio) {
      notify('You have not selected Studio.');
      return;
    }

    const id = event.currentTarget.dataset.id;

    confirm({
      title: 'Are you sure?',
      message: '',
      onAnswer: async (answer) => {
        if (!answer) {
          return;
        }

        NProgress.start();

        try {
          await currentStudio.deleteDiscussion(id);

          notify('You successfully deleted Discussion.');
        } catch (error) {
          console.error(error);
          notify(error);
        } finally {
          NProgress.done();
        }
      },
    });
  };

  public handleDiscussionFormClose = () => {
    this.setState({ discussionFormOpen: false, selectedDiscussion: null });
  };
}

export default observer(DiscussionActionMenu);
