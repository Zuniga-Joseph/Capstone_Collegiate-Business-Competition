"""Remove quiz tables

Revision ID: 366d8cbf9ce7
Revises: ad00db165fa9
Create Date: 2025-12-04 22:33:16.591106

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '366d8cbf9ce7'
down_revision = 'ad00db165fa9'
branch_labels = None
depends_on = None


def upgrade():
    # Drop quiz-related tables that are no longer needed
    op.drop_table('question')
    op.drop_table('quizconfig')


def downgrade():
    # Recreate quiz tables if needed to roll back
    op.create_table('quizconfig',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('questions_per_session', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('question',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('text', sa.String(length=500), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('choices_json', sa.String(), nullable=False),
        sa.Column('correct_answer', sa.Integer(), nullable=False),
        sa.Column('explanation', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
