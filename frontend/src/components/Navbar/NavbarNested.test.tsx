import { render, screen } from '@test-utils';
import { MemoryRouter } from 'react-router-dom';
import { NavbarNested } from './NavbarNested';

describe('NavbarNested', () => {
    it('renders correctly', () => {
        render(
            <MemoryRouter>
                <NavbarNested />
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
});
