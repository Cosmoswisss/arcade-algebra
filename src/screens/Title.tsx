import { go } from '../router';
import { useApp } from '../state';

export default function Title() {
  const { progress } = useApp();
  return (
    <main className="screen title-screen">
      <div className="title-block">
        <p className="kicker">An arcade for linear algebra</p>
        <h1 className="display">Linear<br />Arcade</h1>
        <p className="lead">Seven cabinets. Seven ideas. Grab the arrows, bend the plane, and find out what a matrix really does.</p>
        <button className="btn btn-primary btn-big" onClick={() => go(progress.profile ? '/hall' : '/profile')}>
          {progress.profile ? 'Enter the arcade' : 'Start'}
        </button>
      </div>
    </main>
  );
}
