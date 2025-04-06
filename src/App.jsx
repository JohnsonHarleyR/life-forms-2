import './App.css';
import LifeProvider from './Context/LifeContext';
import CanvasArea from './components/CanvasArea/CanvasArea';

function App() {
  return (
    <LifeProvider>
      <div className="App">
        <header className="App-header">
          <CanvasArea />
        </header>
      </div>
    </LifeProvider>
  );
}

export default App;