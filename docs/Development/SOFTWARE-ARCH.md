


# Software Architecture


Software architecture allows us to structure code in a way that makes it easier to understand, more expandable and modular. 


## Software Architecture

VAYS is *similarly* to an architecture which is commonly used in frontend design: The MVC architecture.


This seperates the software into three main components.


1) The Model: This represents the data, which models 'the reality'. This is the part which interacts with YAC.
    In fact, the model is structured here along the API. Each API call has, if warranted, a seoerate module,
    There, all the different cases of return codes that this API call may return are handled. Caching is
    also handled in this part.


2) The Controller: This takes the data as it is sent from the API and is processed. The result is then handed over to the
    view. That is, the controller tells the view *what* to display. The controller is structured along the GUI.
    That is, every major component has its own control module. This module then calls the model for data and when sending,
    it also hands over this data. The model will then take care of making the correct API calls.

3) The View: The view is concerned with displaying the data it receives from the user. The controller tells *what* to display,
    the view is concerned with *how*.


Some parts, like interfacing with the local/session storage are seperated. While they could have been merged into the model part,
(regarding the storage as a data 'source/sink') seperating seemed the better choice.




