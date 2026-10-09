import { GazaDemographicsView } from '../features/gaza-demographics';
import { Layout } from './Layout.tsx';

// App shell: layout and registration of views. Views live in `features/`; the shell only wires them up.
export function App() {
  return (
    <Layout>
      <GazaDemographicsView />
    </Layout>
  );
}
