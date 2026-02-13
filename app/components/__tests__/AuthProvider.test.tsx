import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import AuthProvider from '../AuthProvider'

describe('AuthProvider', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <AuthProvider session={null}>
        <div>Test Child</div>
      </AuthProvider>
    )

    expect(getByText('Test Child')).toBeInTheDocument()
  })
})
