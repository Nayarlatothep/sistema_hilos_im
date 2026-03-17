import React from 'react';
import { styled } from '../lib/stitches.config';

const LayoutContainer = styled('div', {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$gray50',
});

const Header = styled('header', {
  backgroundColor: 'white',
  borderBottom: '1px solid $border',
  boxShadow: '$sm',
});

const HeaderContent = styled('div', {
  maxWidth: '$maxContent',
  margin: '0 auto',
  padding: '0 $6',
  height: '5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const NavWrapper = styled('div', {
  display: 'flex',
  alignItems: 'center',
});

const Logo = styled('img', {
  height: '3rem',
  width: 'auto',
  marginRight: '$8',
});

const NavLinks = styled('nav', {
  display: 'none',
  gap: '$8',
  '@md': {
    display: 'flex',
  },
  a: {
    textDecoration: 'none',
    color: '$gray500',
    padding: '$1',
    fontWeight: '500',
    transition: 'color 0.2s',
    '&:hover': {
      color: '$primary',
    },
    '&.active': {
      color: '$primary',
      borderBottom: '2px solid $accent',
    }
  }
});

const UserProfile = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$4',
});

const UserText = styled('div', {
  display: 'none',
  textAlign: 'right',
  '@sm': {
    display: 'block',
  },
});

const UserName = styled('p', {
  fontSize: '$sm',
  fontWeight: '500',
  color: '$primary',
});

const UserRole = styled('p', {
  fontSize: '$xs',
  color: '$gray500',
});

const Avatar = styled('div', {
  height: '2.5rem',
  width: '2.5rem',
  borderRadius: '$round',
  backgroundColor: '$primary',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: '700',
});

const Main = styled('main', {
  flexGrow: 1,
  width: '100%',
  maxWidth: '$maxContent',
  margin: '0 auto',
  padding: '$8 $6',
});

const Footer = styled('footer', {
  backgroundColor: '$primary',
  color: 'white',
  padding: '$6 0',
  marginTop: '$12',
});

const FooterContent = styled('div', {
  maxWidth: '$maxContent',
  margin: '0 auto',
  padding: '0 $6',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  '@md': {
    flexDirection: 'row',
  }
});

const FooterText = styled('p', {
  fontSize: '$sm',
  opacity: 0.8,
  marginBottom: '$4',
  '@md': {
    marginBottom: 0,
  }
});

const FooterLinks = styled('div', {
  display: 'flex',
  gap: '$6',
  fontSize: '$sm',
  opacity: 0.8,
  a: {
    color: 'inherit',
    textDecoration: 'none',
    transition: 'color 0.2s',
    '&:hover': { color: '$accent' }
  }
});

export default function AppLayout({ children }) {
  return (
    <LayoutContainer>
      <Header>
        <HeaderContent>
          <NavWrapper>
            <Logo src="data:image/png;base64,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极" alt="Intermoda Logo" />
            <NavLinks>
              <a href="#" className="active">Upload Data</a>
              <a href="#">History</a>
              <a href="#">Reports</a>
            </NavLinks>
          </NavWrapper>

          <UserProfile>
            <UserText>
              <UserName>Admin User</UserName>
              <UserRole>Warehouse Manager</UserRole>
            </UserText>
            <Avatar>AU</Avatar>
          </UserProfile>
        </HeaderContent>
      </Header>

      <Main>{children}</Main>

      <Footer>
        <FooterContent>
          <FooterText>&copy; 2023 Intermoda S.A. All rights reserved.</FooterText>
          <FooterLinks>
            <a href="#">System Status</a>
            <a href="#">Technical Support</a>
            <a href="#">Privacy Policy</a>
          </FooterLinks>
        </FooterContent>
      </Footer>
    </LayoutContainer>
  );
}
