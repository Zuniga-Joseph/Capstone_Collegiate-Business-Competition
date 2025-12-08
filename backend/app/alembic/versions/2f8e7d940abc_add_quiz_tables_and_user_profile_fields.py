"""Add quiz tables and user profile fields

Revision ID: 2f8e7d940abc
Revises: 1a31ce608336
Create Date: 2025-11-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '2f8e7d940abc'
down_revision = '1a31ce608336'
branch_labels = None
depends_on = None


def upgrade():
    # Add user profile fields
    op.add_column('user', sa.Column('university', sa.String(length=200), nullable=True))
    op.add_column('user', sa.Column('major', sa.String(length=200), nullable=True))
    op.add_column('user', sa.Column('gpa', sa.Float(), nullable=True))

    # Create question table
    op.create_table('question',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('text', sa.String(length=500), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('choices_json', sa.String(), nullable=False),
        sa.Column('correct_answer', sa.Integer(), nullable=False),
        sa.Column('explanation', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Create quizconfig table
    op.create_table('quizconfig',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('questions_per_session', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop quiz tables
    op.drop_table('quizconfig')
    op.drop_table('question')

    # Drop user profile fields
    op.drop_column('user', 'gpa')
    op.drop_column('user', 'major')
    op.drop_column('user', 'university')
