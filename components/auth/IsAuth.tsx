import { RedirectToSignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import React from 'react';

const IsAuth = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) {
    return <RedirectToSignIn />
  }

  return children
}

export default IsAuth