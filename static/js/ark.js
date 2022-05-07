
// TODO
// https://www.getzola.org/documentation/templates/overview/#custom-templates
// See if we can get this embedded into that page, and then look into bundling from there
'use strict';

const e = React.createElement;

class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return e(
      'button',
      { onClick: () => this.setState({ liked: true }) },
      'Like'
    );
  }
}

const domContainer = document.querySelector('#app-root');
const root = ReactDOM.createRoot(domContainer);
root.render(e(LikeButton));