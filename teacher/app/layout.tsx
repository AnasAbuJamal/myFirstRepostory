import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'LumenVale Teacher Studio',description:'A secure classroom dashboard for the City of Knowledge'};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
