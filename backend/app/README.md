# Using SQLModel and Updating the Schema

The FastAPI full stack uses [SQLModel](https://sqlmodel.tiangolo.com/) to make model tables and read / write to them. This README will hopefully help you in creating new tables, creating API calls for them, and making them permanent to the repository. 

I implemented `Scores` and `Leaderboards` as placeholder models, I would reference the `User` model instead as a starting point for introducing new models instead.

## Prerequisites

Before doing anything, follow the setup outlined in the README file for the `/backend` directory, and get comfortable with the Docker container.

## Loading New Changes In the Docker Container

To make sure the Docker container will have the new tables, do the following:

```bash
# if Docker container is still running
docker compose down
docker compose up -d
docker compose exec backend alembic upgrade head

# optional, but helps verify things are working
# (that is, IF they made unit tests for changes)
docker compose backend bash scripts/tests-start.sh
```

## Adding Models to `models.py`

This is where new tables are introduced. Read up on the SQLModel docs (just for adding to SQLModel, not engine stuff) or ask an LLM for help implementing it with their syntax (if you have already designed the models).

## Adding CRUD operations in `crud.py`

Create, Read, Update, and Delete operations are defined here and called by the API.

Instead of sanitized strings, statements to execute are structured as if they were objects to operate on, it is very similar to Java Streams, where you can structure it like the following:

```
statement = select(User).where(User.email == email)
```

## Creating and Copying Migrations

***I had a lot of trouble with this, there may be a better way to do it. the REAMDE in `/backend` did not work for me, so this allowed me to make schema changes persistent

Modifying the tables is not enough to make it persist when the docker container is constructed. To do this, you need to perform a Migration in Alembic, which acts like Git but for the database.

These are the steps I took to make them persistent to be pushed to the remote repo:

1) `cd` to `/backend` and enter the container: 
```
docker compose exec backend bash
```
2) Create an alembic revision describing the changes you've made:
```
alembic revision --autogenerate -m "<message here>"
```
3) Check if alembic saved this as a file in `./app/alembic/versions`:
```
ls -la ./app/alembic/versions
# filename should be of form XXXXXX_<message here>.py
```
4) Apply the migration
```
alembic upgrade head
```
5) *(Optional) Use the following script to check if the tables were preserved:*
```bash
python -c "
from sqlmodel import Session, text
from app.core.db import engine
with Session(engine) as session:
    result = session.exec(text('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\''))
    tables = [table[0] for table in result.fetchall()]
    print('Tables:', sorted(tables))
"
```
6) Exit the container
```
exit
```
7) Copy the migration to your local repository
```
# paths may be different, took some trial and error to find the right one
docker compose cp backend:/app/app/alembic/versions backend/app/alembic
```

You should now see it in your local repository, even outside of the docker container. Doing this makes the schema changes you have made persistent and usable by other people on the team. All you need to do now is add and commit it to Git

## Test Files

### For New Models

In `/backend/tests/utils`, create a Python file named after the model for each of the models you have created. This allows you to perform unit tests with them.

### For CRUD Tests

In `/backend/tests/crud/`, create a Python file with the naming schema "test_{model_name}.py" to create unit tests for database transactions

## API Routes

Exposing these models with API endpoints can be done at `/backend/app/api/`...
- new routes are added in `./routes/`
- after adding those routes, include the router in `./main.py`

### API Tests

Creating unit tests can be done under `backend/tests/api/routes/`, and new files should have the naming scheme: "test_{api_file_name}.py"