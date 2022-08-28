import { render, screen } from '@testing-library/react'
import React from 'react'
import { TestWrapper } from '../../utils/TestWrapper'
import { useOstSession } from '../../utils/auth/hooks'
import PostSettings from '.'

jest.mock('../../utils/auth/hooks')

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  register: jest.fn(),
  handleSubmit: jest.fn()
}))

describe('<PostSettings />', () => {
  it('should render the date', async () => {
    ;(useOstSession as jest.Mock).mockReturnValue({
      session: {
        user: {
          username: 'avitorio'
        }
      },
      status: 'authenticated'
    })
    render(
      <TestWrapper>
        <PostSettings saveFunc={() => {}} loading={false} showDelete={false} />
      </TestWrapper>
    )

    expect(screen.getByText('July 14, 2022')).toBeInTheDocument()
  })
})
