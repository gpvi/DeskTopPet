import PetShell from './ui/desktop-pet/PetShell';
import './styles/global.css';

function App() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(18, 18, 35, 0.95)',
    }}>
      <PetShell />
    </div>
  );
}

export default App;
