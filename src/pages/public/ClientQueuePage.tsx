import React from 'react';
import StorefrontPage from '../../app/page';

interface ClientQueuePageProps {
  onNavigate?: (path: string) => void;
}

export const ClientQueuePage: React.FC<ClientQueuePageProps> = () => {
  return <StorefrontPage />;
};
