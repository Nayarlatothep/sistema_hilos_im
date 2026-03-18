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

export default function AppLayout({ children, currentTab, onTabChange }) {
  return (
    <LayoutContainer>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet" />
      <Header>
        <HeaderContent>
          <NavWrapper>
            <Logo src="https://lh3.googleusercontent.com/aida/ADBb0ujjnX_BfJjQ0SUWgHpqJ1gv1wmTgUCBZCN_ggtke6FlYCk-MZ7J5KkSne154r2BVcQziUDav-AM6IE3DGP0aiioI_UNXbSyDSh2-KbE09X0j44oYU5tQgMgVM733Mt8aLE3wFcipBxlLpig-5novUVMO3RQ_9L-fOoJu-rpNyVjO1FGNeeH51ymkVGl3D33iyPgbLrHeze8a2yVkOBym3Za5xDwQcLiMxKnYyY59gzNFBKz655-TT9siSPxI259Agf9HyXpZBcRUw" alt="Intermoda Logo" />
            <NavLinks>
              <a
                href="#"
                className={currentTab === 'dashboard' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); onTabChange('dashboard'); }}
              >
                Progreso
              </a>
              <a
                href="#"
                className={currentTab === 'upload' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); onTabChange('upload'); }}
              >
                Cargar Datos
              </a>
              <a
                href="#"
                className={currentTab === 'transfer' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); onTabChange('transfer'); }}
              >
                Transferencias:
              </a>
            </NavLinks>
          </NavWrapper>

          <UserProfile>
            <UserText>
              <UserName>V. Rojas</UserName>
              <UserRole>Warehouse Manager</UserRole>
            </UserText>
            <Avatar>VR</Avatar>
          </UserProfile>
        </HeaderContent>
      </Header>

      <Main>{children}</Main>

      <Footer>
        <FooterContent>
          <FooterText>&copy; 2024 Intermoda S.A. Sistema de Control de Producción v2.4</FooterText>
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
